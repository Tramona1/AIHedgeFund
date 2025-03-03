export namespace interviewsService {
    /**
     * Get recent interviews
     */
    function getRecentInterviews(limit?: number, speaker?: any): Promise<({
        id: string;
        video_id: string;
        video_url: string;
        title: string;
        speaker: string;
        timestamp: string;
        summary: string;
        highlights: {
            value_investing: string;
            interest_rates: string;
            tech_sector: string;
            artificial_intelligence?: undefined;
            genomics?: undefined;
            blockchain?: undefined;
            debt_cycles?: undefined;
            reserve_currency?: undefined;
            china_rise?: undefined;
        };
        transcript_url: string;
        processed_at: string;
    } | {
        id: string;
        video_id: string;
        video_url: string;
        title: string;
        speaker: string;
        timestamp: string;
        summary: string;
        highlights: {
            artificial_intelligence: string;
            genomics: string;
            blockchain: string;
            value_investing?: undefined;
            interest_rates?: undefined;
            tech_sector?: undefined;
            debt_cycles?: undefined;
            reserve_currency?: undefined;
            china_rise?: undefined;
        };
        transcript_url: string;
        processed_at: string;
    } | {
        id: string;
        video_id: string;
        video_url: string;
        title: string;
        speaker: string;
        timestamp: string;
        summary: string;
        highlights: {
            debt_cycles: string;
            reserve_currency: string;
            china_rise: string;
            value_investing?: undefined;
            interest_rates?: undefined;
            tech_sector?: undefined;
            artificial_intelligence?: undefined;
            genomics?: undefined;
            blockchain?: undefined;
        };
        transcript_url: string;
        processed_at: string;
    })[]>;
    /**
     * Get available interview speakers
     */
    function getSpeakers(): Promise<string[]>;
}
