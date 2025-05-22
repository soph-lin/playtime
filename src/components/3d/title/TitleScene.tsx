import Title from "./Title";
import MusicNotes from "./MusicNotes";
import TitleRecord from "./TitleRecord";

export default function TitleScene() {
  return (
    <>
      <Title />
      <MusicNotes />
      <TitleRecord />

      {/* Environment Setup */}
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={1} castShadow />
    </>
  );
}
