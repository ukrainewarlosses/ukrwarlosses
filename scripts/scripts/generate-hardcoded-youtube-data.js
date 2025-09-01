"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHardcodedYouTubeData = generateHardcodedYouTubeData;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const youtube_1 = require("../src/lib/youtube");
// Load environment variables from .env file
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: path_1.default.join(process.cwd(), '.env') });
async function generateHardcodedYouTubeData() {
    try {
        console.log('🎥 Generating hardcoded YouTube video data...');
        const youtubeService = new youtube_1.YouTubeService();
        let youtubeVideos = [];
        try {
            // Fetch latest videos from History Legends
            const videos = await youtubeService.getHistoryLegendsLatestVideos();
            if (videos && videos.length > 0) {
                youtubeVideos = videos.map(video => ({
                    title: video.title,
                    youtube_id: video.id,
                    channel_name: 'History Legends'
                }));
                console.log(`📺 Successfully fetched ${youtubeVideos.length} videos from YouTube API`);
            }
            else {
                throw new Error('No videos returned from API');
            }
        }
        catch (error) {
            console.warn('⚠️ Failed to fetch from YouTube API, using fallback videos:', error);
            // Use fallback videos if API fails
            youtubeVideos = [
                {
                    title: 'Ukraine War Update - Latest Military Developments',
                    youtube_id: 'dQw4w9WgXcQ',
                    channel_name: 'History Legends',
                },
                {
                    title: 'Military Analysis: Russia vs Ukraine Forces',
                    youtube_id: 'oHg5SJYRHA0',
                    channel_name: 'History Legends',
                },
                {
                    title: 'War Report: Current Situation Analysis',
                    youtube_id: 'fC7oUOUEEi4',
                    channel_name: 'History Legends',
                },
            ];
        }
        console.log(`📊 Generated YouTube data:`, {
            videoCount: youtubeVideos.length,
            videos: youtubeVideos.map(v => ({ title: v.title, id: v.youtube_id }))
        });
        const hardcodedData = {
            videos: youtubeVideos,
            lastUpdated: new Date().toISOString()
        };
        // Write the hardcoded data file (JSON)
        const outputPath = path_1.default.join(process.cwd(), 'src', 'data', 'hardcoded-youtube-data.json');
        await fs_1.promises.writeFile(outputPath, JSON.stringify(hardcodedData, null, 2), 'utf8');
        console.log('✅ Hardcoded YouTube data saved to:', outputPath);
        // Also generate TypeScript file with the data
        const tsContent = `// Auto-generated hardcoded YouTube video data
// Last updated: ${new Date().toISOString()}

export interface YouTubeEmbed {
  title: string;
  youtube_id: string;
  channel_name: string;
}

export interface HardcodedYouTubeData {
  videos: YouTubeEmbed[];
  lastUpdated: string;
}

export const hardcodedYouTubeData: HardcodedYouTubeData = ${JSON.stringify(hardcodedData, null, 2)};
`;
        const tsOutputPath = path_1.default.join(process.cwd(), 'src', 'data', 'hardcoded-youtube-data.ts');
        await fs_1.promises.writeFile(tsOutputPath, tsContent, 'utf8');
        console.log('✅ TypeScript hardcoded YouTube data saved to:', tsOutputPath);
        return hardcodedData;
    }
    catch (error) {
        console.error('❌ Error generating hardcoded YouTube data:', error);
        throw error;
    }
}
// Run if called directly
if (process.argv[1] && process.argv[1].includes('generate-hardcoded-youtube-data')) {
    generateHardcodedYouTubeData()
        .then(() => {
        console.log('🎉 YouTube data generation complete!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Failed to generate YouTube data:', error);
        process.exit(1);
    });
}
