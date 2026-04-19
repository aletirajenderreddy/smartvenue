export default function WeatherBanner({weather}){if(!weather)return null;return <div className='rounded-lg bg-white/10 p-2 text-sm'>Weather: {weather.summary}</div>;}
