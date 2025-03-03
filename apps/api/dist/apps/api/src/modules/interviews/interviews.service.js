import { logger } from "@repo/logger";
import { generateId, IDPrefix } from "@repo/id";
// Create component logger
const serviceLogger = logger.child({ component: "interviews-service" });
// Sample mock data for interviews
const mockInterviews = [
    {
        id: generateId(IDPrefix.INTERVIEW),
        video_id: "abc123xyz",
        video_url: "https://www.youtube.com/watch?v=abc123xyz",
        title: "Interview with Warren Buffett: Market Outlook 2023",
        speaker: "Warren Buffett",
        timestamp: new Date().toISOString(),
        summary: "Warren Buffett discusses his outlook on the market for 2023, focusing on value investing principles and the challenges of high interest rates.",
        highlights: {
            "value_investing": "Value investing remains relevant even in changing market conditions",
            "interest_rates": "Higher interest rates impact equity valuations significantly",
            "tech_sector": "Tech valuations are becoming more reasonable, but selectivity is key"
        },
        transcript_url: "https://asset.cloudinary.com/demo/raw/upload/v1/buffett-interview-transcript.txt",
        processed_at: new Date().toISOString()
    },
    {
        id: generateId(IDPrefix.INTERVIEW),
        video_id: "def456uvw",
        video_url: "https://www.youtube.com/watch?v=def456uvw",
        title: "Cathie Wood on Disruptive Innovation",
        speaker: "Cathie Wood",
        timestamp: new Date().toISOString(),
        summary: "Cathie Wood discusses how disruptive innovation is reshaping industries and creating new investment opportunities, particularly in AI, genomics, and blockchain.",
        highlights: {
            "artificial_intelligence": "AI will transform every sector of the economy",
            "genomics": "The genomic revolution will dramatically reduce healthcare costs",
            "blockchain": "Blockchain technology extends far beyond cryptocurrencies"
        },
        transcript_url: "https://asset.cloudinary.com/demo/raw/upload/v1/wood-interview-transcript.txt",
        processed_at: new Date().toISOString()
    },
    {
        id: generateId(IDPrefix.INTERVIEW),
        video_id: "ghi789rst",
        video_url: "https://www.youtube.com/watch?v=ghi789rst",
        title: "Ray Dalio on Changing World Order",
        speaker: "Ray Dalio",
        timestamp: new Date().toISOString(),
        summary: "Ray Dalio explains his framework for understanding major shifts in the global economy and geopolitics, drawing from historical patterns.",
        highlights: {
            "debt_cycles": "Long-term debt cycles typically last 75-100 years",
            "reserve_currency": "The US dollar's reserve currency status is being challenged",
            "china_rise": "China's economic rise follows historical patterns of emerging powers"
        },
        transcript_url: "https://asset.cloudinary.com/demo/raw/upload/v1/dalio-interview-transcript.txt",
        processed_at: new Date().toISOString()
    }
];
// Interviews Service with mock data
export const interviewsService = {
    /**
     * Get recent interviews
     */
    async getRecentInterviews(limit = 10, speaker = null) {
        serviceLogger.info("Getting recent interviews", { limit, speaker });
        try {
            // Filter by speaker if provided
            let filtered = [...mockInterviews];
            if (speaker) {
                filtered = filtered.filter(interview => interview.speaker && interview.speaker.toLowerCase().includes(speaker.toLowerCase()));
            }
            // Sort by timestamp (newest first) and limit results
            const interviews = filtered
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, limit);
            serviceLogger.info(`Found ${interviews.length} interviews`);
            return interviews;
        }
        catch (error) {
            serviceLogger.error("Error getting interviews", {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    },
    /**
     * Get available interview speakers
     */
    async getSpeakers() {
        serviceLogger.info("Getting interview speakers");
        try {
            // Extract unique speakers from mock data
            const speakers = [...new Set(mockInterviews
                    .filter(interview => interview.speaker)
                    .map(interview => interview.speaker))];
            serviceLogger.info(`Found ${speakers.length} interview speakers`);
            return speakers;
        }
        catch (error) {
            serviceLogger.error("Error getting interview speakers", {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
};
//# sourceMappingURL=interviews.service.js.map