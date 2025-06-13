import L from "leaflet";

const iconUrl = "/images/marker-icon.png";
const shadowUrl = "/images/marker-shadow.png";

const {
  iconSize,
  shadowSize,
  iconAnchor,
  shadowAnchor,
  popupAnchor,
  tooltipAnchor,
} = L.Marker.prototype.options.icon.options;

export const defaultIcon = L.icon({
  iconUrl,
  shadowUrl,
  iconSize,
  shadowSize,
  iconAnchor,
  shadowAnchor,
  popupAnchor,
  tooltipAnchor,
});
