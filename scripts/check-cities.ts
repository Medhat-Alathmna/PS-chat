// Quick diagnostic script to check for cities with invalid coordinates
import { CITIES } from './lib/data/cities';

console.log('Checking all cities for invalid coordinates...\n');

const invalidCities = CITIES.filter(city => {
    const hasInvalidLat = typeof city.lat !== 'number' || isNaN(city.lat);
    const hasInvalidLng = typeof city.lng !== 'number' || isNaN(city.lng);
    return hasInvalidLat || hasInvalidLng;
});

if (invalidCities.length === 0) {
    console.log('✅ All cities have valid coordinates!');
    console.log(`Total cities checked: ${CITIES.length}`);
} else {
    console.log(`❌ Found ${invalidCities.length} cities with invalid coordinates:\n`);
    invalidCities.forEach(city => {
        console.log(`City: ${city.nameAr} (${city.name})`);
        console.log(`  ID: ${city.id}`);
        console.log(`  Lat: ${city.lat} (type: ${typeof city.lat}, isNaN: ${isNaN(city.lat)})`);
        console.log(`  Lng: ${city.lng} (type: ${typeof city.lng}, isNaN: ${isNaN(city.lng)})`);
        console.log('');
    });
}
