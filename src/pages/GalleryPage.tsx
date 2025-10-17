import Gallery from '../components/Gallery';
import backgroundImage from '../Login_Sign/photo.jpeg';

export default function GalleryPage() {
  return (
    <div 
      className="relative min-h-screen font-sans text-gray-200 overflow-x-hidden"
    >
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url(${backgroundImage})`
        }}
      ></div>

      {/* Overlay Layer */}
      <div className="absolute inset-0 bg-black/70 z-0"></div>

      <main className="relative z-10 pt-16">
        <Gallery />
      </main>
    </div>
  );
}
