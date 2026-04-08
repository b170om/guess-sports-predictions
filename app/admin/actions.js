'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4'
const IMPORT_SOURCE = 'football-data'
const CHAMPIONS_LEAGUE_CODE = 'CL'
const IMPORT_WINDOW_DAYS = 21

async function checkAdminRole(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', user.id)
    .single()

  return profile?.role === 'admin'
}

async function requireAdmin() {
  const supabase = await createClient()

  if (!(await checkAdminRole(supabase))) {
    return { supabase, error: 'Unauthorized. Admin access required.' }
  }

  return { supabase, error: null }
}

function revalidateAppPaths() {
  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/past-results')
  revalidatePath('/leaderboard')
  revalidatePath('/profile')
}

function normalizeFutureMatchDatetime(rawValue) {
  const value = typeof rawValue === 'string' ? rawValue.trim() : ''

  if (!value) {
    return { error: 'Missing match date and time.' }
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return { error: 'Invalid match date and time.' }
  }

  if (parsedDate.getTime() <= Date.now()) {
    return { error: 'Match date and time must be in the future.' }
  }

  return { iso: parsedDate.toISOString() }
}

function toApiDate(date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function getTeamName(team) {
  return team?.shortName || team?.name || 'TBD'
}

async function fetchFootballData(pathname, params = {}) {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY

  if (!apiKey) {
    throw new Error('Missing FOOTBALL_DATA_API_KEY in .env.local')
    console.log('ENV CHECK -> FOOTBALL_DATA_API_KEY exists:', Boolean(process.env.FOOTBALL_DATA_API_KEY))
    console.log('ENV CHECK -> FOOTBALL_DATA_API_KEY length:', process.env.FOOTBALL_DATA_API_KEY?.length ?? 0)
    console.log(
      'ENV CHECK -> football-related keys:',
      Object.keys(process.env).filter((key) => key.includes('FOOTBALL'))
    )
  }

  const url = new URL(`${FOOTBALL_DATA_BASE_URL}${pathname}`)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-Auth-Token': apiKey,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`football-data request failed (${response.status}): ${text.slice(0, 200)}`)
  }

  return response.json()
}

export async function createMatch(formData) {
  const { supabase, error: adminError } = await requireAdmin()

  if (adminError) {
    return { error: adminError }
  }

  const home_team = String(formData.get('home_team') ?? '').trim()
  const away_team = String(formData.get('away_team') ?? '').trim()
  const match_datetime_raw = formData.get('match_datetime')

  if (!home_team || !away_team || !match_datetime_raw) {
    return { error: 'Missing required fields.' }
  }

  if (home_team.toLowerCase() === away_team.toLowerCase()) {
    return { error: 'Home team and away team must be different.' }
  }

  const normalizedDatetime = normalizeFutureMatchDatetime(match_datetime_raw)

  if (normalizedDatetime.error) {
    return { error: normalizedDatetime.error }
  }

  const { error } = await supabase.from('matches').insert([
    {
      home_team,
      away_team,
      match_datetime: normalizedDatetime.iso,
      status: 'pending',
      actual_home_score: null,
      actual_away_score: null,
      is_published: true,
      external_source: null,
      external_match_id: null,
      home_team_crest_url: null,
      away_team_crest_url: null,
    },
  ])

  if (error) {
    console.error('Error creating match:', error)
    return { error: error.message }
  }

  revalidateAppPaths()
  return { success: true }
}

export async function importChampionsLeagueMatches() {
  const { supabase, error: adminError } = await requireAdmin()

  if (adminError) {
    return { error: adminError }
  }

  try {
    const now = new Date()
    const endDate = addDays(now, IMPORT_WINDOW_DAYS)

    const data = await fetchFootballData(`/competitions/${CHAMPIONS_LEAGUE_CODE}/matches`, {
      dateFrom: toApiDate(now),
      dateTo: toApiDate(endDate),
    })

    const apiMatches = Array.isArray(data?.matches) ? data.matches : []

    const upcomingMatches = apiMatches.filter((match) => {
      const kickoff = new Date(match.utcDate)
      return !Number.isNaN(kickoff.getTime()) && kickoff.getTime() > Date.now()
    })

    if (upcomingMatches.length === 0) {
      return {
        success: true,
        createdCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        message: 'No upcoming Champions League matches were found in the next 21 days.',
      }
    }

    const externalIds = upcomingMatches.map((match) => String(match.id))

    const { data: existingMatches, error: existingError } = await supabase
      .from('matches')
      .select('id, external_match_id, is_published')
      .eq('external_source', IMPORT_SOURCE)
      .in('external_match_id', externalIds)

    if (existingError) {
      console.error('Error loading existing imported matches:', existingError)
      return { error: existingError.message }
    }

    const existingMap = new Map(
      (existingMatches || []).map((match) => [String(match.external_match_id), match])
    )

    const rows = upcomingMatches.map((apiMatch) => {
      const existing = existingMap.get(String(apiMatch.id))

      return {
        home_team: getTeamName(apiMatch.homeTeam),
        away_team: getTeamName(apiMatch.awayTeam),
        match_datetime: new Date(apiMatch.utcDate).toISOString(),
        status: 'pending',
        actual_home_score: null,
        actual_away_score: null,
        is_published: existing?.is_published ?? false,
        external_source: IMPORT_SOURCE,
        external_match_id: String(apiMatch.id),
        home_team_crest_url: apiMatch.homeTeam?.crest ?? null,
        away_team_crest_url: apiMatch.awayTeam?.crest ?? null,
      }
    })

    const { error: upsertError } = await supabase
      .from('matches')
      .upsert(rows, { onConflict: 'external_source,external_match_id' })

    if (upsertError) {
      console.error('Error importing Champions League matches:', upsertError)
      return { error: upsertError.message }
    }

    const updatedCount = rows.filter((row) => existingMap.has(row.external_match_id)).length
    const createdCount = rows.length - updatedCount

    revalidateAppPaths()

    return {
      success: true,
      createdCount,
      updatedCount,
      skippedCount: 0,
      message: 'Champions League matches imported as drafts.',
    }
  } catch (error) {
    console.error('Import CL matches failed:', error)
    return { error: error.message || 'Import failed.' }
  }
}

export async function syncChampionsLeagueResults() {
  const { supabase, error: adminError } = await requireAdmin()

  if (adminError) {
    return { error: adminError }
  }

  try {
    const { data: matchesToSync, error: matchesError } = await supabase
      .from('matches')
      .select('id, home_team, away_team, external_match_id, status')
      .eq('external_source', IMPORT_SOURCE)
      .neq('status', 'finished')
      .not('external_match_id', 'is', null)

    if (matchesError) {
      console.error('Error loading matches for sync:', matchesError)
      return { error: matchesError.message }
    }

    const candidates = matchesToSync || []

    if (candidates.length === 0) {
      return {
        success: true,
        checkedCount: 0,
        syncedCount: 0,
        unchangedCount: 0,
        failedMatches: [],
        message: 'No imported Champions League matches need syncing right now.',
      }
    }

    let syncedCount = 0
    let unchangedCount = 0
    const failedMatches = []

    for (const match of candidates) {
      try {
        const rawApiResponse = await fetchFootballData(`/matches/${match.external_match_id}`)
        const apiMatch = rawApiResponse?.match ?? rawApiResponse

        const apiStatus = apiMatch?.status
        const fullTimeHome = apiMatch?.score?.fullTime?.home
        const fullTimeAway = apiMatch?.score?.fullTime?.away

        if (
          apiStatus === 'FINISHED' &&
          typeof fullTimeHome === 'number' &&
          typeof fullTimeAway === 'number'
        ) {
          const { error: updateError } = await supabase
            .from('matches')
            .update({
              status: 'finished',
              actual_home_score: fullTimeHome,
              actual_away_score: fullTimeAway,
            })
            .eq('id', match.id)

          if (updateError) {
            console.error(`Error updating finished match ${match.id}:`, updateError)
            failedMatches.push({
              matchId: match.id,
              label: `${match.home_team} vs ${match.away_team}`,
              reason: updateError.message,
            })
            unchangedCount += 1
            continue
          }

          syncedCount += 1
          continue
        }

        unchangedCount += 1
      } catch (matchError) {
        console.error(`Sync failed for match ${match.id}:`, matchError)
        failedMatches.push({
          matchId: match.id,
          label: `${match.home_team} vs ${match.away_team}`,
          reason: matchError?.message || 'Unknown sync error',
        })
        unchangedCount += 1
      }
    }

    revalidateAppPaths()

    return {
      success: true,
      checkedCount: candidates.length,
      syncedCount,
      unchangedCount,
      failedMatches,
      message: 'Champions League result sync completed.',
    }
  } catch (error) {
    console.error('Sync CL results failed:', error)
    return { error: error.message || 'Sync failed.' }
  }
}

async function setMatchPublishedState(matchIdRaw, isPublished) {
  const { supabase, error: adminError } = await requireAdmin()

  if (adminError) {
    return { error: adminError }
  }

  const matchId = Number(matchIdRaw)

  if (!matchId) {
    return { error: 'Invalid match ID.' }
  }

  const { error } = await supabase
    .from('matches')
    .update({ is_published: isPublished })
    .eq('id', matchId)

  if (error) {
    console.error('Error updating publish state:', error)
    return { error: error.message }
  }

  revalidateAppPaths()
  return { success: true }
}

export async function publishMatch(matchIdRaw) {
  return setMatchPublishedState(matchIdRaw, true)
}

export async function unpublishMatch(matchIdRaw) {
  return setMatchPublishedState(matchIdRaw, false)
}

export async function updateMatchResult(formData) {
  const { supabase, error: adminError } = await requireAdmin()

  if (adminError) {
    return { error: adminError }
  }

  const match_id_raw = formData.get('match_id')
  const home_score_raw = formData.get('actual_home_score')
  const away_score_raw = formData.get('actual_away_score')
  const raw_status = String(formData.get('status') ?? '').trim()

  const match_id = Number(match_id_raw)

  if (!match_id) {
    return { error: 'Missing or invalid Match ID.' }
  }

  const { data: existingMatch, error: matchLoadError } = await supabase
    .from('matches')
    .select('id, match_datetime, status')
    .eq('id', match_id)
    .single()

  if (matchLoadError || !existingMatch) {
    return { error: 'Match not found.' }
  }

  const kickoffTs = new Date(existingMatch.match_datetime).getTime()

  if (Number.isNaN(kickoffTs)) {
    return { error: 'Match kickoff time is invalid.' }
  }

  const status = raw_status === 'finished' ? 'finished' : 'pending'

  if (status === 'finished' && Date.now() < kickoffTs) {
    return { error: 'You cannot mark a match as finished before its kickoff time has passed.' }
  }

  const parsedHomeScore =
    home_score_raw === '' || home_score_raw === null
      ? null
      : parseInt(home_score_raw, 10)

  const parsedAwayScore =
    away_score_raw === '' || away_score_raw === null
      ? null
      : parseInt(away_score_raw, 10)

  if (
    status === 'finished' &&
    (parsedHomeScore === null ||
      parsedAwayScore === null ||
      Number.isNaN(parsedHomeScore) ||
      Number.isNaN(parsedAwayScore))
  ) {
    return { error: 'Scores are required to finish a match.' }
  }

  const actual_home_score = status === 'finished' ? parsedHomeScore : null
  const actual_away_score = status === 'finished' ? parsedAwayScore : null

  const { error } = await supabase
    .from('matches')
    .update({
      actual_home_score,
      actual_away_score,
      status,
    })
    .eq('id', match_id)

  if (error) {
    console.error('Error updating match result:', error)
    return { error: error.message }
  }

  revalidateAppPaths()
  return { success: true }
}

export async function deleteMatch(matchIdRaw) {
  const { supabase, error: adminError } = await requireAdmin()

  if (adminError) {
    return { error: adminError }
  }

  const matchId = Number(matchIdRaw)

  if (!matchId) {
    return { error: 'Invalid match ID.' }
  }

  const { error: predictionsError } = await supabase
    .from('predictions')
    .delete()
    .eq('match_id', matchId)

  if (predictionsError) {
    console.error('Error deleting related predictions:', predictionsError)
    return { error: predictionsError.message }
  }

  const { error: matchError } = await supabase
    .from('matches')
    .delete()
    .eq('id', matchId)

  if (matchError) {
    console.error('Error deleting match:', matchError)
    return { error: matchError.message }
  }

  revalidateAppPaths()
  return { success: true }
}