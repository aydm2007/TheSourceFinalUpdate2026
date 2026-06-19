export interface Region {
  name: string;
  latency: number;
}

export class RegionRouter {
  private regions: Region[] = [
    { name: "US", latency: 80 },
    { name: "EU", latency: 60 },
    { name: "MENA", latency: 40 }
  ];

  route(): Region {
    // Return the region with the lowest latency
    const sorted = [...this.regions].sort((a, b) => a.latency - b.latency);
    return sorted[0];
  }

  setRegions(regions: Region[]) {
    this.regions = regions;
  }

  getRegions(): Region[] {
    return this.regions;
  }
}

export default new RegionRouter();
