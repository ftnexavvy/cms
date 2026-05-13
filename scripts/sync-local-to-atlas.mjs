import mongoose from "mongoose";

const LOCAL_URI = "mongodb://localhost:27017/blogs";
const ATLAS_URI = "mongodb+srv://ftnexavvy_db_user:Next%402025@cluster0.1h19pnn.mongodb.net/?appName=Cluster0";

async function sync() {
  console.log("Connecting to LOCAL database...");
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  
  console.log("Connecting to ATLAS database...");
  const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();

  // Define Schema (flexible)
  const PostSchema = new mongoose.Schema({}, { strict: false });
  const LocalPost = localConn.model("Post", PostSchema);
  const AtlasPost = atlasConn.model("Post", PostSchema);

  console.log("Fetching posts from local...");
  const posts = await LocalPost.find({});
  console.log(`Found ${posts.length} posts locally.`);

  if (posts.length === 0) {
    console.log("No posts found to migrate.");
    await localConn.close();
    await atlasConn.close();
    return;
  }

  console.log("Uploading to Atlas...");
  for (const post of posts) {
    const data = post.toObject();
    delete data._id; // Let Atlas generate new IDs or use same if you prefer
    
    await AtlasPost.findOneAndUpdate(
      { slug: data.slug, siteId: data.siteId },
      data,
      { upsert: true }
    );
    console.log(`Synced: ${data.title}`);
  }

  console.log("✅ All posts synced successfully to Atlas!");
  
  await localConn.close();
  await atlasConn.close();
}

sync().catch(err => {
  console.error("❌ Sync failed:", err);
  process.exit(1);
});
