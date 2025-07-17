'use client';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Slider from 'react-slick';
import Image from 'next/image';
import Link from 'next/link';
import { QuickSearch } from 'app/components/QuickSearch';

type HeroCarouselProps = {
  topCities: {
    id: number;
    cityName: string | null;
    images: { id: number; fileName: string; isPrimary: boolean; mediumPath: string; largePath: string; originalPath: string; thumbnailPath: string; isHallOfFame?: boolean; }[];
    user: { username: string | null; } | null;
  }[];
};

export function HeroCarousel({ topCities }: HeroCarouselProps) {
  return (
    <div className="relative">
      <Slider
        dots={true}
        infinite={true}
        speed={500}
        slidesToShow={1}
        slidesToScroll={1}
        autoplay={true}
        autoplaySpeed={15000}
        arrows={true}
        className="w-full h-[500px] sm:h-[600px]"
      >
        {topCities.map((city, index) => {
          const primaryImage = city.images?.find((img: { isPrimary: boolean }) => img.isPrimary) || city.images?.[0];
          const imagePath = primaryImage?.originalPath || primaryImage?.largePath || primaryImage?.mediumPath;
          const isPlaceholder = !imagePath || imagePath.includes('placeholder-image.png');
          
          return (
            <div key={city.id} className="relative h-[500px] sm:h-[600px] w-full">
              {isPlaceholder ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/80 text-white text-2xl sm:text-3xl font-bold select-none" style={{height: '100%', minHeight: 500}}>
                  <span className="text-6xl mb-4">🏙️</span>
                  <span>This city is so mysterious, they didn&apos;t even upload a picture!</span>
                </div>
              ) : (
                <img
                  src={imagePath}
                  alt={city.cityName || 'City image'}
                  width={1920}
                  height={1080}
                  className="w-full h-full object-cover brightness-50"
                  loading="eager"
                  srcSet={[
                    primaryImage?.thumbnailPath && `${primaryImage.thumbnailPath} 400w`,
                    primaryImage?.mediumPath && `${primaryImage.mediumPath} 800w`,
                    primaryImage?.largePath && `${primaryImage.largePath} 1200w`,
                    primaryImage?.originalPath && `${primaryImage.originalPath} 3840w`
                  ].filter(Boolean).join(', ')}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1920px"
                  style={{ width: '100%', height: '100%' }}
                />
              )}
              
              {/* Hall of Fame Icon */}
              {primaryImage?.isHallOfFame && (
                <div className="absolute bottom-4 right-4 z-10">
                  <div className="bg-yellow-400 rounded-full p-1 shadow-lg">
                    <img
                      src="/logo/hof-icon.svg"
                      alt="Hall of Fame"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                  </div>
                </div>
              )}
              {/* Ranking Badge */}
              <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-lg border-2 border-white">
                #{index + 1}
              </div>
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center text-center px-4 pb-8">
                <span className="text-2xl sm:text-3xl font-bold text-white mr-4">
                  {city.cityName} by {city.user?.username || 'Anonymous'}
                </span>
                <Link
                  href={`/city/${city.id}`}
                  className="bg-white text-gray-800 px-4 py-2 rounded-full font-semibold hover:bg-gray-200 transition"
                >
                  View City
                </Link>
              </div>
            </div>
          );
        })}
      </Slider>
      
      {/* Hero text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
          Discover & Share Incredible Cities
        </h1>
        <p className="text-xl text-gray-200 max-w-3xl mx-auto mb-8">
          The ultimate hub for Cities: Skylines 2 creators. Upload your save files, showcase your work, and explore masterpieces from the community.
        </p>
        <div className="max-w-xl mx-auto pointer-events-auto">
          <QuickSearch />
        </div>
      </div>
    </div>
  );
} 