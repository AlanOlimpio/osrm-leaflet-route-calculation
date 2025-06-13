import L from "leaflet";

const iconUrl = "/images/custom-icon-car-1.png";
const shadowUrl = "/images/marker-shadow.png";

const {
  iconSize,
  shadowSize,
  iconAnchor,
  shadowAnchor,
  popupAnchor,
  tooltipAnchor,
} = L.Marker.prototype.options.icon.options;

export const autoIcon = L.icon({
  iconUrl,
  shadowUrl,
  iconSize,
  shadowSize,
  iconAnchor,
  shadowAnchor,
  popupAnchor,
  tooltipAnchor,
});
