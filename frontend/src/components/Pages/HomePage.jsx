import Carousel from '../ui/Carousel/Carousel'
import '../ui/Carousel/carousel.css'
import ProducerSignupAdvert from '../sections/ProducerSignupAdvert'

export default function HomePage() {
  return (
    <main>
      <Carousel />
      <ProducerSignupAdvert />
    </main>
  )
}