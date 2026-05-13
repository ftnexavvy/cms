import connectDB from "./lib/mongodb";
import Post from "./models/Post";

async function checkImages() {
  await connectDB();
  const posts = await Post.find({}).limit(10).lean();
  
  console.log("--- IMAGE STATUS CHECK ---");
  posts.forEach(post => {
    console.log(`Title: ${post.title}`);
    console.log(`- Featured Image (old field): ${post.image}`);
    console.log(`- Featured Image (new field): ${JSON.stringify(post.featuredImage)}`);
    if (post.structuredContent?.strategies) {
      post.structuredContent.strategies.forEach((s, i) => {
        console.log(`  - Strategy ${i} Image: ${s.image}`);
      });
    }
    console.log("---------------------------");
  });
  process.exit(0);
}

checkImages();
