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
    images: { id: number; fileName: string; isPrimary: boolean; mediumPath: string; largePath: string; thumbnailPath: string; }[];
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
        {topCities.map((city) => {
          const primaryImage = city.images?.find((img: { isPrimary: boolean }) => img.isPrimary) || city.images?.[0];
          
          return (
            <div key={city.id} className="relative h-[500px] sm:h-[600px] w-full">
              <Image
                src={primaryImage?.mediumPath || '/placeholder-image.png'}
                alt={city.cityName || 'City image'}
                width={1200}
                height={600}
                className="w-full h-full object-cover brightness-50"
                priority
              />
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