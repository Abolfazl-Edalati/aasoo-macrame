import "./App.css";
import Carousel from "./components/Carousel";
import Collections from "./components/Collections";
import Gift from "./components/Gift";
import HeroSection from "./components/HeroSection";
import Inspiration from "./components/Inspiration";
import NavBar from "./components/NavBar";
import Story from "./components/Story";

function App() {
  return (
    <div data-theme="" className="mb-20">
      <NavBar />
      <HeroSection />
      <Story />
      <Collections />
      <Carousel />
      <Inspiration />
      <Gift />
    </div>
  );
}

export default App;
