import express from "express";
import {PrismaClient} from '@prisma/client';
import { getAuthUser, protect } from "../middleware/authorization";
const prisma = new PrismaClient();

function getVideoRoutes() {
  const router = express.Router();
  //'api/v1/videos'
  router.get('/', getRecommendedVideos);
  router.get('/trending', getTrendingVideos);
  router.get('/search', searchVideos);
  router.get('/:videoId', getAuthUser, getVideo);
  router.delete('/:videoId', protect, deleteVideo);

  router.post('/', protect ,addVideo);
  router.get('/:videoId/view', getAuthUser, addVideoView);
  router.get('/:videoId/like', protect, likeVideo);
  router.get('/:videoId/dislike', protect, dislikeVideo);
  router.post('/:videoId/comments', protect , addComment);
  router.delete('/:videoId/comments/:commentId', protect , deleteComment);
  return router;
}

async function getVideoViews(videos){
  for (const video of videos) {
    //!REFACTOR
    const views = await prisma.view.count({
      where: {
        videoId: {
          equals: video.id
        }
      }
    });
    video.views = views;
  }
  return videos;
}

async function getRecommendedVideos(req, res) {
  let videos = await prisma.video.findMany({
    include: {
      user: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  if(!videos.length){
    return res.status(200).json({videos});
  }

  videos = await getVideoViews(videos)

  res.status(200).json({videos})
}

async function getTrendingVideos(req, res) {
  let videos = await prisma.video.findMany({
    include: {
      user: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  if(!videos.length){
    return res.status(200).json({videos});
  }
  videos = await getVideoViews(videos);
  videos.sort((a,b)=>b.views-a.views);
  res.status(200).json({videos})
}

async function searchVideos(req, res, next) {
  if(!req.query.query){
    return next({
      message: "please aenter a search query",
      statusCode: 400
    })
  }

  let videos = await prisma.video.findMany({
    include: {
      user: true
    },
    where: {
      OR: [
        {
          title: {
            contains: req.query.query,
            mode: "insensitive"
          },
          description: {
            contains: req.query.query,
            mode: "insensitive"
          },
        }
      ]
    }
  });

  if(!videos.length){
    return res.status(200).json({videos});
  }
  videos = await getVideoViews(videos);
  res.status(200).json({videos})
}

async function addVideo(req, res) {
  const {title, description, url, thumbnail} = req.body

  let video = await prisma.video.create({
    data: {
      title, description, url, thumbnail,
      user: {
        connect: {
          id: req.user.id
        }
      }
    }
  });

  return res.status(200).json({video});
}

async function addComment(req, res, next) {
  let video = await prisma.video.findUnique({
    where: {
      id: req.params.videoId
    }
  })

  if(!video){
    return next({
      message: `No video found with id "${req.params.videoId}"`,
      statusCode: 404
    })
  }

  let comment = await prisma.comment.create({
    data: {
      text: req.body.text,
      user: {
        connect: {
          id: req.user.id
        }
      },
      video: {
        connect: {
          id: req.params.videoId
        }
      }
    }
  });

  res.status(200).json({comment});
}

async function deleteComment(req, res) {
  let comment = await prisma.comment.findUnique({
    where: {
      id: req.params.commentId
    },
    select: {
      userId: true
    }
  });

  if(comment.userId!==req.user.id){
    return res.status(401).send("youre not authorizes to delete this comment")
  }

  let commentDelete = prisma.comment.delete({
    where: {
      id: req.params.commentId
    }
  });

  res.status(200).json({commentDelete});
}

async function addVideoView(req, res, next) {
  let video = await prisma.video.findUnique({
    where: {
      id: req.params.videoId
    }
  });

  if(!video){
    return next({
      message: `No video found with id: "${req.params.videoId}"`,
      statusCode: 404
    });
  }

  let view = {};

  if(req.user) {
    view = await prisma.view.create({
      data:{
        video:{
          connect: {
            id: req.params.videoId
          }
        },
        user: {
          connect: {
            id: req.user.id
          }
        }
      }
    });
  } else {
    view = await prisma.view.create({
      data:{
        video:{
          connect: {
            id: req.params.videoId
          }
        }
      }
    });
  }
  res.status(200).json(view);
}

async function likeVideo(req, res, next) {
  let video = await prisma.video.findUnique({
    where: {
      id: req.params.videoId
    }
  });

  if(!video){
    return next({
      message: `No video found with id: "${req.params.videoId}"`,
      statusCode: 404
    });
  }

  const isLiked = await prisma.videoLike.findFirst({
    where: {
      userId: {
        equals: req.user.id
      },
      videoId: {
        equals: req.params.videoId
      },
      like: {
        equals: 1
      }
    }
  });

  const isDisliked = await prisma.videoLike.findFirst({
    where: {
      userId: {
        equals: req.user.id
      },
      videoId: {
        equals: req.params.videoId
      },
      like: {
        equals: -1
      }
    }
  });

  if (isLiked) {
    await prisma.videoLike.delete({
      where: {
        id: isLiked.id
      }
    });
  } else if (isDisliked) {
    await prisma.videoLike.update({
      where: {
        id: isDisliked.id
      },
      data: {
        like: 1
      }
    });
  } else {
    await prisma.videoLike.create({
      data: {
        user:{
          connect: {
            id: req.user.id
          }
        },
        video: {
          connect: {
            id: req.params.videoId
          }
        },
        like: 1
      }
    });
  }

  res.status(200).json({});
}


async function dislikeVideo(req, res, next) {
  let video = await prisma.video.findUnique({
    where: {
      id: req.params.videoId
    }
  });

  if(!video){
    return next({
      message: `No video found with id: "${req.params.videoId}"`,
      statusCode: 404
    });
  }

  const isLiked = await prisma.videoLike.findFirst({
    where: {
      userId: {
        equals: req.user.id
      },
      videoId: {
        equals: req.params.videoId
      },
      like: {
        equals: 1
      }
    }
  });

  const isDisliked = await prisma.videoLike.findFirst({
    where: {
      userId: {
        equals: req.user.id
      },
      videoId: {
        equals: req.params.videoId
      },
      like: {
        equals: -1
      }
    }
  });

  if (isDisliked) {
    await prisma.videoLike.delete({
      where: {
        id: isDisliked.id
      }
    });
  } else if (isLiked) {
    await prisma.videoLike.update({
      where: {
        id: isLiked.id
      },
      data: {
        like: -1
      }
    });
  } else {
    await prisma.videoLike.create({
      data: {
        user:{
          connect: {
            id: req.user.id
          }
        },
        video: {
          connect: {
            id: req.params.videoId
          }
        },
        like: -1
      }
    })
  }
  
  res.status(200).json({});
}

async function getVideo(req, res, next) {
  const video = await prisma.video.findUnique({
    where: {
      id: req.params.videoId
    },
    include: {
      user: true,
      comments: {
        include: {
          user: true
        },
        orderBy: {
          createdAt: "desc"
        }
      },

    }
  });

  if(!video){
    return next({
      message: `No video found with id: "${req.params.videoId}"`,
      statusCode: 404
    });
  }

  let isVideoMine = false;
  let isLiked = false;
  let isDisliked = false;
  let isSubscribed = false;
  let isViewed = false;

  if (req.user) {
    isVideoMine = req.user.id === video.userId;

    //!REFACTOR
    isLiked = await prisma.videoLike.findFirst({
      where: {
        userId: {
          equals: req.user.id
        },
        videoId: {
          equals: req.params.videoId
        },
        like: {
          equals: 1
        }
      }
    });
  
    //!REFACTOR
    isDisliked = await prisma.videoLike.findFirst({
      where: {
        userId: {
          equals: req.user.id
        },
        videoId: {
          equals: req.params.videoId
        },
        like: {
          equals: -1
        }
      }
    });

    //!REFACTOR
    isViewed = await prisma.view.findFirst({
      where:{
        userId:{
          equals: req.user.id
        },
        videoId: {
          equals: video.id
        }
      }
    });

    isSubscribed = await prisma.subscription.findFirst({
      where:{
        subscriberId: {
          equals: req.user,id
        },
        subscribedToId: {
          equals: video.userId
        }
      }
    });
  }//end id req.user

  //!REFACTOR
  const likesCount = await prisma.videoLike.count({
    where: {
      AND:{
        videoId:{
          equals: req.params.videoId
        },
        like: {
          equals: 1
        }
      }
    }
  });//end likesCount

  //!REFACTOR
  const dislikesCount = await prisma.videoLike.count({
    where: {
      AND:{
        videoId:{
          equals: req.params.videoId
        },
        like: {
          equals: -1
        }
      }
    }
  });//end dislikesCount

  //!REFACTOR
  const views = await prisma.view.count({
    where: {
      videoId: {
        equals: video.id
      }
    }
  });//END views

  const subscribersCount = await prisma.subscription.count({
    where:{
      subscribedToId:{
        equals: video.userId
      }
    }
  });//END subscribersCount

  video.commentsCount = video.comments.length;
  video.isLiked = Boolean(isLiked);
  video.isDisliked = Boolean(isDisliked);
  video.likesCount = likesCount;
  video.dislikesCount = dislikesCount;
  video.isVideoMine = isVideoMine;
  video.views = views;
  video.isSubscribed = Boolean(isSubscribed);
  video.isViewed = Boolean(isViewed);
  video.subscribersCount = subscribersCount;

  res.status(200).json({ video });
}

async function deleteVideo(req, res) {
  const video = await prisma.video.findUnique({
    where: {
      id: req.params.videoId
    },
    select: {
      userId: true
    }
  });

  if (req.user.id !== video.userId) {
    return res.status(401).send('you are not authorized to delete this video');
  }

  // delete many
  ['view', 'videoLike', 'comments'].forEach( model => {
    await prisma.model.deleteMany({
      where: {
        videoId: {
          equals: req.params.videoId
        }
      }
    });//END deleteMany
  });//testing corrected again
  // delete one
  await prisma.video.delete({
    where:{
      id: req.params.videoId
    }
  });
  
  res.status(200).json({});
}

export { getVideoRoutes };
