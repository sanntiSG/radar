declare module 'google-trends-api' {
  interface TrendsOptions {
    keyword: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string;
  }
  function interestOverTime(options: TrendsOptions): Promise<string>;
  function dailyTrends(options: { geo: string; trendDate?: Date }): Promise<string>;
  function relatedQueries(options: TrendsOptions): Promise<string>;
  export default { interestOverTime, dailyTrends, relatedQueries };
}
