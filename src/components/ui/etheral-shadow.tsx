'use client';

import React, { useEffect, useRef, CSSProperties } from 'react';
import { animate, motion, useMotionValue, AnimationPlaybackControls } from 'framer-motion';

// Type definitions
interface ResponsiveImage {
    src: string;
    alt?: string;
    srcSet?: string;
}

interface AnimationConfig {
    preview?: boolean;
    scale: number;
    speed: number;
}

interface NoiseConfig {
    opacity: number;
    scale: number;
}

interface ShadowOverlayProps {
    type?: 'preset' | 'custom';
    presetIndex?: number;
    customImage?: ResponsiveImage;
    sizing?: 'fill' | 'stretch';
    color?: string;
    animation?: AnimationConfig;
    noise?: NoiseConfig;
    style?: CSSProperties;
    className?: string;
}

function mapRange(
    value: number,
    fromLow: number,
    fromHigh: number,
    toLow: number,
    toHigh: number
): number {
    if (fromLow === fromHigh) {
        return toLow;
    }
    const percentage = (value - fromLow) / (fromHigh - fromLow);
    return toLow + percentage * (toHigh - toLow);
}

export function Component({
    sizing = 'fill',
    color = 'rgba(128, 128, 128, 1)',
    animation,
    noise,
    style,
    className
}: ShadowOverlayProps) {
    const animationEnabled = !!animation && animation.scale > 0;
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const zoom = useMotionValue(1.08);
    const driftControls = useRef<AnimationPlaybackControls | null>(null);
    const swayControls = useRef<AnimationPlaybackControls | null>(null);
    const zoomControls = useRef<AnimationPlaybackControls | null>(null);

    const driftPx = animation ? mapRange(animation.scale, 1, 100, 8, 28) : 0;
    const durationSec = animation ? mapRange(animation.speed, 1, 100, 24, 6) : 12;

    useEffect(() => {
        if (driftControls.current) driftControls.current.stop();
        if (swayControls.current) swayControls.current.stop();
        if (zoomControls.current) zoomControls.current.stop();

        if (!animationEnabled) {
            x.set(0);
            y.set(0);
            zoom.set(1.08);
            return;
        }

        driftControls.current = animate(x, [0, driftPx, -driftPx, 0], {
            duration: durationSec,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut"
        });

        swayControls.current = animate(y, [0, -driftPx * 0.7, driftPx * 0.7, 0], {
            duration: durationSec * 1.15,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut"
        });

        zoomControls.current = animate(zoom, [1.07, 1.13, 1.07], {
            duration: durationSec * 1.35,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut"
        });

        return () => {
            if (driftControls.current) driftControls.current.stop();
            if (swayControls.current) swayControls.current.stop();
            if (zoomControls.current) zoomControls.current.stop();
        };
    }, [animationEnabled, driftPx, durationSec, x, y, zoom]);

    return (
        <div
            className={className}
            style={{
                overflow: "hidden",
                position: "relative",
                width: "100%",
                height: "100%",
                ...style
            }}
        >
            <motion.div
                style={{
                    position: "absolute",
                    inset: -driftPx,
                    x,
                    y,
                    scale: zoom,
                    filter: "blur(6px)",
                    willChange: "transform",
                }}
            >
                <div
                    style={{
                        backgroundColor: color,
                        maskImage: `url('https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png')`,
                        WebkitMaskImage: `url('https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png')`,
                        maskSize: sizing === "stretch" ? "100% 100%" : "cover",
                        WebkitMaskSize: sizing === "stretch" ? "100% 100%" : "cover",
                        maskRepeat: "no-repeat",
                        WebkitMaskRepeat: "no-repeat",
                        maskPosition: "center",
                        WebkitMaskPosition: "center",
                        width: "100%",
                        height: "100%"
                    }}
                />
            </motion.div>

            {noise && noise.opacity > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `url("https://framerusercontent.com/images/g0QcWrxr87K0ufOxIUFBakwYA8.png")`,
                        backgroundSize: noise.scale * 200,
                        backgroundRepeat: "repeat",
                        opacity: noise.opacity / 2
                    }}
                />
            )}
        </div>
    );
}
