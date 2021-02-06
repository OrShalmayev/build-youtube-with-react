import { PrismaClient } from '@prisma/client';
import express from "express";
import { protect } from '../middleware/authorization';
import { getVideoViews } from './video';

const prisma = new PrismaClient();

function getUserRoutes() {
  const router = express.Router();

  router.get('/liked-videos', protect, getLikedVideos);

  return router;
}

async function getLikedVideos(req, res, next) {
  const videoLikes = await prisma.videoLike.findMany({
    where: {
      userId: req.user.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const videoIds = videoLikes.map(videoLike => videoLike.videoId);

  let videos = await prisma.video.findMany({
    where: {
      id: {
        in: videoIds
      }
    },
    include: {
      user: true
    }
  });

  if (!videos.length) {
    return res.status(200).json({videos});
  }

  videos = await getVideoViews(videos);
  res.status(200).json({videos});
}

async function getHistory(req, res, next) {}

async function toggleSubscribe(req, res, next) {}

async function getFeed(req, res) {}

async function searchUser(req, res, next) {}

async function getRecommendedChannels(req, res) {}

async function getProfile(req, res, next) {}

async function editUser(req, res) {}

export { getUserRoutes };
