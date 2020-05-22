import React from "react";
import { Source } from "react-mapbox-gl";
import { LngLat } from "mapbox-gl";
import Alert from "@material-ui/lab/Alert";
import { useTranslation } from "react-i18next";
import { findBounds } from "../helpers/mapbox-coordinates";
import {
  CROWN_HEIGHTS_BOUNDS,
  CROWN_HEIGHTS_CENTER_COORD
} from "../helpers/map-constants";
import BasicMap from "./BasicMap";
import { QuadrantsLayers } from "./QuadrantMap";
import ClusterMapLayers from "./ClusterMapLayers";

const makeBounds = features => {
  const lnglats = features.map(f => {
    const [lng, lat] = f.geometry.coordinates;
    return new LngLat(lng, lat);
  });

  const bounds =
    lnglats.length > 0
      ? findBounds([...CROWN_HEIGHTS_BOUNDS, ...lnglats])
      : CROWN_HEIGHTS_BOUNDS;

  return bounds;
};

const getRequestParam = () => {
  const searchStr = window.location && window.location.search;
  return searchStr
    .slice(1)
    .split("&")
    .reduce((acc, token) => {
      const matches = token.match(/request=(.*)/);
      return matches ? matches[1] : acc;
    }, "");
};

// Alert to show when a request from URL param does not exist
const RequestNotFoundAlert = ({ requestCode }) => {
  const { t: str } = useTranslation();
  return (
    <Alert severity="warning">
      {str("webapp.deliveryNeeded.requestNotFound.message", {
        defaultValue: `Request with code {{requestCode}} is not found. This means that the request is no longer in 'Delivery Needed' status.`,
        requestCode
      })}
{" "}
      <a
        href={str("webapp.deliveryNeeded.requestNotFound.redirectLink", {
          defaultValue: "/delivery-needed"
        })}
      >
        {str("webapp.deliveryNeeded.requestNotFound.redirectMessage", {
          defaultValue: `See all requests instead.`
        })}
      </a>
    </Alert>
  );
};

const ClusterMap = ({ geoJsonData, containerStyle = {} }) => {
  if (!geoJsonData) {
    return null;
  }

  let paramRequest;
  const requestCode = getRequestParam();
  const { requests, drivingClusterRequests } = geoJsonData;
  const { features: reqFeatures } = requests;
  const { features: clusterFeatures } = drivingClusterRequests;
  const allRequests = [...reqFeatures, ...clusterFeatures];

  if (requestCode) {
    // find first feature with code match to be passed
    // into ClusterMapLayers
    [paramRequest] = allRequests.filter(
      ({
        properties: {
          meta: { Code }
        }
      }) => Code === requestCode
    );
  }

  // there is a requestCode but the request object does not exist
  const paramRequestNotFound = requestCode && !paramRequest;

  return (
    <>
      {paramRequestNotFound && (
        <RequestNotFoundAlert requestCode={requestCode} />
      )}

      <BasicMap
        center={CROWN_HEIGHTS_CENTER_COORD}
        bounds={makeBounds(allRequests)}
        containerStyle={containerStyle}
      >
        <QuadrantsLayers />
        <Source
          id="requestsSource"
          geoJsonSource={{
            type: "geojson",
            data: requests,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 30
          }}
        />
        <Source
          id="drivingClusterRequestsSource"
          geoJsonSource={{
            type: "geojson",
            data: drivingClusterRequests,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 30
          }}
        />
        <ClusterMapLayers
          sourceId="requestsSource"
          paramRequest={paramRequest}
          color="orangered"
        />
        <ClusterMapLayers
          sourceId="drivingClusterRequestsSource"
          paramRequest={paramRequest}
          color="rebeccapurple"
        />
      </BasicMap>
    </>
  );
};

export default ClusterMap;
