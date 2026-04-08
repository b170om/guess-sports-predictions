export async function GET() {
    return Response.json({
        exists: Boolean(process.env.FOOTBALL_DATA_API_KEY),
        length: process.env.FOOTBALL_DATA_API_KEY?.length ?? 0,
        cwd: process.cwd(),
    });
}