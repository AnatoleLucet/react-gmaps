import * as React from "react";
import { useGMapsInstance } from "../../hooks/use-gmaps-instance";
import { useGMapsSDK } from "../../hooks/use-gmaps-sdk";
import { GMapsMarker } from "../gmaps-marker";
import { useGMapsMarker } from "../../hooks/use-gmaps-marker";
import { animation } from "../../lib/animation";
import { Animate } from "../../lib/animation/animate";

export namespace GMapsAnimatedMarker {
  type Options = Pick<GMapsMarker.Options, "location" | "zIndex"> & {
    duration?: number;
  };

  export type Props = React.PropsWithChildren<GMapsMarker.Props & Options>;

  export type Animate = (options: Options) => void;

  export type Ref = GMapsMarker.Ref & {
    animate: Animate;
  };
}

export const GMapsAnimatedMarker = React.forwardRef<
  GMapsAnimatedMarker.Ref,
  GMapsAnimatedMarker.Props
>(({ location, zIndex, duration = 1000, ...props }, ref) => {
  const map = useGMapsInstance();
  const google = useGMapsSDK();
  const marker = useGMapsMarker();

  const initialLocation = React.useRef(location);
  const runningAnimation = React.useRef<Animate | null>(null);

  const animate = React.useCallback<GMapsAnimatedMarker.Animate>(
    (opts) => {
      if (!marker.current) return;

      if (runningAnimation.current) {
        runningAnimation.current.stop();
      }

      const lat = marker.current.location.lat();
      const lng = marker.current.location.lng();

      runningAnimation.current = animation.animate({
        duration: opts.duration || duration,
        easing: animation.easings.easeInOutCubic,
        tick: (t) => {
          const latDiff = opts.location.lat - lat;
          const lngDiff = opts.location.lng - lng;

          marker.current?.update({
            ...opts,
            location: {
              lat: lat + latDiff * t,
              lng: lng + lngDiff * t,
            },
          });
        },
      });
    },
    [marker.current]
  );

  // updates
  React.useEffect(() => {
    if (!map || !google || !marker.current) return;

    animate({
      duration,
      location,
      zIndex,
    });
  }, [map, google, location, zIndex]);

  React.useImperativeHandle(ref, () => ({
    ...(marker.current as GMapsMarker.Ref),
    animate,
  }));

  return (
    <GMapsMarker ref={marker} location={initialLocation.current} {...props} />
  );
});