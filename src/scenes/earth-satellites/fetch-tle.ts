export async function fetchTLEData(endpoint: string) {
    try {
        const response = await fetch(endpoint);
        const data = await response.text();

        const tleLines = data.trim().split('\n');
        const tleData = [];

        for (let i = 0; i < tleLines.length; i += 3) {
            const satellite = {
                name: tleLines[i].trim(),
                line1: tleLines[i + 1].trim(),
                line2: tleLines[i + 2].trim()
            };
            tleData.push(satellite);
        }

        return tleData;

    } catch (error) {
        console.error("Error fetching TLE data:", error);
    }
}