import L from "leaflet";

const iconUrl = "/images/marker-icon.png";
const shadowUrl = "/images/marker-shadow.png";

const defaultIconOptions = L.Marker.prototype.options.icon?.options;

if (!defaultIconOptions) {
  throw new Error("Default Leaflet marker icon not available.");
}

const {
  iconSize,
  shadowSize,
  iconAnchor,
  shadowAnchor,
  popupAnchor,
  tooltipAnchor,
} = defaultIconOptions;

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
