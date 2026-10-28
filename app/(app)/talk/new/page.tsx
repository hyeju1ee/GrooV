import { TopBar } from '@/components/ui'
import { createPost } from '../actions'
import { PostForm } from '../PostForm'

export const metadata = { title: '글쓰기' }

export default function NewPostPage() {
  return (
    <main className="main sub">
      <TopBar back="/talk" title="글쓰기" />
      <PostForm action={createPost} />
    </main>
  )
}
