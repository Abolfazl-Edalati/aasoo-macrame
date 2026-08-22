import "./App.css";
import Carousel from "./components/Carousel";
import Collections from "./components/Collections";
import Footer from "./components/Footer";
import Gift from "./components/Gift";
import HeroSection from "./components/HeroSection";
import Inspiration from "./components/Inspiration";
import NavBar from "./components/NavBar";
import Story from "./components/Story";

function App() {
  return (
    <div data-theme="">
      <NavBar />
      <HeroSection />
      <Story />
      <Collections />
      <Carousel />
      <Inspiration />
      <Gift />
      <Footer />
    </div>
  );
}

export default App;
