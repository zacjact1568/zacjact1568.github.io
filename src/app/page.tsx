import styles from "./page.module.css";
import { readPostBasics } from "@/models/source";
import PostCard from "@/components/post-card";

export default function Home() {
  const posts = readPostBasics();
  return (
    <>
      {posts.map((post) => (
        <PostCard key={post.id} data={post} className={styles.item} />
      ))}
    </>
  );
}
