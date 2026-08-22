import "./App.css";
import Carousel from "./components/Carousel";
import Collections from "./components/Collections";
import HeroSection from "./components/HeroSection";
import NavBar from "./components/NavBar";
import Story from "./components/Story";

function App() {
  return (
    <div data-theme="nord">
      <NavBar />
      <HeroSection />
      <Story />
      <Collections />
      <Carousel />
    </div>
  );
}

export default App;
