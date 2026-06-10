// Tweaks panel for the MHA blog redesign mockup.
// Applies values as data-attributes on <html>, which mha.css reads.

const MHA_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "gold",
  "intensity": "bold",
  "heroShadow": true
}/*EDITMODE-END*/;

function MhaTweaksApp() {
  const [t, setTweak] = useTweaks(MHA_TWEAK_DEFAULTS);

  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.accent = t.accent;
    root.dataset.intensity = t.intensity;
    root.classList.toggle('no-hero-shadow', !t.heroShadow);
  }, [t]);

  return (
    <TweaksPanel>
      <TweakSection label="Color" />
      <TweakRadio
        label="Accent"
        value={t.accent}
        options={['gold', 'red', 'sky']}
        onChange={(v) => setTweak('accent', v)}
      />
      <TweakSection label="Manga texture" />
      <TweakRadio
        label="Intensity"
        value={t.intensity}
        options={['bold', 'subtle']}
        onChange={(v) => setTweak('intensity', v)}
      />
      <TweakSection label="Headers" />
      <TweakToggle
        label="Offset shadow on titles"
        value={t.heroShadow}
        onChange={(v) => setTweak('heroShadow', v)}
      />
    </TweaksPanel>
  );
}

(function mountMhaTweaks() {
  const host = document.createElement('div');
  host.id = 'mha-tweaks-root';
  document.body.appendChild(host);
  ReactDOM.createRoot(host).render(<MhaTweaksApp />);
})();
