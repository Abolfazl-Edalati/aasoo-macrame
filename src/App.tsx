import "./App.css";
import HeroSection from "./components/HeroSection";
import NavBar from "./components/NavBar";
import Story from "./components/Story";

function App() {
  return (
    <div data-theme="nord">
      <NavBar />
      <HeroSection />
      <Story />
    </div>
  );
}

export default App;
