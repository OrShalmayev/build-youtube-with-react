import { PrismaClient } from '@prisma/client';
import express from "express";
import { protect } from '../middleware/authorization';
import { getVideoViews } from './video';

const prisma = new PrismaClient();


/**
 * Helpers
 */
async function getVideos(model, req, res) {
  const videoRelations = await prisma[model].findMany({
    where: {
      userId: req.user.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const videoIds = videoRelations.map(videoLike => videoLike.videoId);

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

/**
 * Router
 */
function getUserRoutes() {
  const router = express.Router();

  router.get('/liked-videos', protect, getLikedVideos);
  router.get('/history', protect, getHistory);
  router.get('/:userId/toggle-subscribe', protect, toggleSubscribe);

  return router;
}

/**
 * Controllers
 */
async function getLikedVideos(req, res) {
  await getVideos('videoLike', req, res);
}

async function getHistory(req, res) {
  await getVideos('view', req, res);
}

async function toggleSubscribe(req, res, next) {
  if (req.user.id === req.params.userId) {
    return next({
      message: "You cannot subscribe to your own channel",
      statusCode: 400
    });
  }

  // check if user exists
  const user = await prisma.user.findUnique({
    where: {
      id: req.params.userId
    }
  });

  // user not exists
  if (!user) {
    return next({
      message: `No use found with id: "${req.params.userId}"`,
      statusCode: 404
    });
  }

  // the user does exists
  const isSubscribed = await prisma.subscription.findFirst({
    where: {
      subscriberId:{
        equals: req.user.id
      },
      subscribedToId: {
        equals: req.params.userId
      }
    }
  });

  if (isSubscribed) {
    await prisma.subscription.delete({
      where: {
        id: isSubscribed.id
      }
    });
  } else {
    await prisma.subscription.create({
      data:{
        subscriber: {
          connect: {
            id: req.user.id
          }
        },
        subscribedTo: {
          connect: {
            id: req.params.userId
          }
        }
      }
    });
  }

  res.status(200).json({});
}

async function getFeed(req, res) {}

async function searchUser(req, res, next) {}

async function getRecommendedChannels(req, res) {}

async function getProfile(req, res, next) {}

async function editUser(req, res) {}

export { getUserRoutes };
