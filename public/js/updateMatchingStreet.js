export async function updateMatchingStreet(coordinates) {
  // get the address from the coordinates
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coordinates[1]}&lon=${coordinates[0]}`
  );
  const data = await response.json();
  const address = data.address;
  const district =
    address.city_district || address.borough || address.municipality;
  console.log(`${address.road} in ${district}`);

  const matchingStreetElement = document.getElementById("matching-street");
  if (!matchingStreetElement) return;
  matchingStreetElement.innerHTML = `${address.road} in ${district}`;
}
