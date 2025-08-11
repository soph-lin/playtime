interface CharacterSpriteProps {
  characterName: string;
}

export default function CharacterSprite({ characterName }: CharacterSpriteProps) {
  const getSprite = (name: string) => {
    switch (name) {
      case "blues":
        return "🎵";
      case "drum":
        return "🥁";
      case "sitar":
        return "🎸";
      case "bongo-drum":
        return "🥁";
      case "maracas":
        return "🎵";
      case "rock-guitar":
        return "🎸";
      case "accordion":
        return "🪗";
      default:
        return "🎭";
    }
  };

  return <span className="text-lg">{getSprite(characterName)}</span>;
}
