type BackgroundLayerProps = {
  backgroundImage: string;
};

export function BackgroundLayer({ backgroundImage }: BackgroundLayerProps) {
  return (
    <div className="fixed inset-0 z-[-1]">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-300"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
      />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-none" />
    </div>
  );
}

