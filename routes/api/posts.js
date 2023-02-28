const express = require('express');
const router = express.Router();
const { createPost, fetchPosts, getSinglePost, likePost, sharePost, pinPost, deletePost, displayRecommendedTagsList, getPost } = require("../../controllers/posts");


router.get("/tags", displayRecommendedTagsList)

router.get('/getPost', getPost);

router.get('/', fetchPosts);

router.get('/:id', getSinglePost);

router.post('/', createPost);

router.put("/:id/like", likePost)

router.post("/:id/share", sharePost)

router.put("/:id/pin", pinPost)

router.delete("/:id", deletePost)


module.exports = router;
