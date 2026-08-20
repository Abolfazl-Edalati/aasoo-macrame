import "./App.css";
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
    </div>
  );
}

export default App;
