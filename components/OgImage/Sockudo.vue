<script setup lang="ts">
defineProps({
    title: {
        type: String,
        default: "Sockudo Documentation",
    },
    description: {
        type: String,
        default: "Production-Ready Realtime Infrastructure",
    },
});
</script>

<template>
    <div
        :style="{
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background:
                'linear-gradient(145deg, #0f0f1a 0%, #1a1025 40%, #0d0d1a 100%)',
            fontFamily: 'sans-serif',
            position: 'relative',
            overflow: 'hidden',
        }"
    >
        <!-- Top purple accent line -->
        <div
            :style="{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '4px',
                background:
                    'linear-gradient(90deg, transparent 0%, #7938d3 30%, #9b5de5 50%, #7938d3 70%, transparent 100%)',
            }"
        />

        <!-- Subtle glow behind icon -->
        <div
            :style="{
                position: 'absolute',
                top: '140px',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background:
                    'radial-gradient(circle, rgba(121, 56, 211, 0.15) 0%, transparent 70%)',
            }"
        />

        <!-- Ninja icon (inlined SVG for Satori compatibility) -->
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 420 366"
            width="160"
            height="160"
            :style="{ marginBottom: '32px' }"
        >
            <!-- Ninja head circle -->
            <path
                fill="#1e1e2e"
                d="m417.1,182.95c0,101.05-75.63,182.96-168.92,182.96s-168.91-81.91-168.91-182.96c0-12.16,1.1-24.04,3.2-35.54,3.7-20.44,10.56-39.65,20.01-57.03C131.78,36.3,186.06,0,248.17,0s116.39,36.3,145.72,90.38c9.45,17.38,16.31,36.59,20.01,57.03,2.1,11.49,3.2,23.37,3.2,35.54Z"
            />
            <!-- Purple headband -->
            <path
                fill="#7938d3"
                d="m413.9,147.41c-3.7-20.44-10.56-39.65-20.01-57.03H102.51C81.83,59.35,46.52,38.9,6.42,38.9c-1.96,0-3.91.06-5.86.15,8.49,32.92,31.13,60.13,61.05,74.78C35.46,118.16,13.15,133.91,0,155.78c10.27,4.16,21.5,6.44,33.25,6.44,18.21,0,35.13-5.48,49.22-14.87,0,.02,0,.04-.01.06h331.43Z"
            />
            <!-- White mask/face -->
            <path
                fill="#fefcfb"
                d="m324.17,235.47h-151.98c-24.85,0-45-20.15-45-45v-41.93c0-3.97,3.32-7.13,7.29-6.91,13.07.71,40.16,2.13,51.04,2.38,31.32.75,93.99.75,125.31,0,10.88-.26,37.97-1.68,51.04-2.38,3.96-.21,7.29,2.94,7.29,6.91v41.93c0,24.85-20.15,45-45,45Z"
            />
            <!-- Eyes -->
            <path
                fill="#0a131a"
                d="m216.5,200.84c-6.56,6.78-16.09,10.66-26.49,9.57-15.53-1.63-27.78-14.64-28.55-30.24-.36-7.22,1.66-13.94,5.38-19.45.72-1.08,2.28-1.52,3.46-1l41.87,18.74c8.8,3.94,11.04,15.44,4.34,22.37Z"
            />
            <path
                fill="#0a131a"
                d="m279.86,200.84c6.56,6.78,16.09,10.66,26.49,9.57,15.53-1.63,27.78-14.64,28.55-30.24.36-7.22-1.66-13.94-5.38-19.45-.72-1.08-2.28-1.52-3.46-1l-41.87,18.74c-8.8,3.94-11.04,15.44-4.34,22.37Z"
            />
        </svg>

        <!-- Title -->
        <div
            :style="{
                fontSize: '52px',
                fontWeight: '700',
                color: '#ffffff',
                textAlign: 'center',
                lineHeight: '1.2',
                maxWidth: '900px',
                marginBottom: '16px',
                letterSpacing: '-0.02em',
            }"
        >
            {{ title }}
        </div>

        <!-- Description -->
        <div
            :style="{
                fontSize: '24px',
                fontWeight: '400',
                color: '#a0a0b8',
                textAlign: 'center',
                maxWidth: '750px',
                lineHeight: '1.4',
                marginBottom: '40px',
            }"
        >
            {{ description }}
        </div>

        <!-- Bottom bar with branding -->
        <div
            :style="{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '24px 48px',
                borderTop: '1px solid rgba(121, 56, 211, 0.2)',
                background:
                    'linear-gradient(180deg, transparent 0%, rgba(121, 56, 211, 0.05) 100%)',
            }"
        >
            <div
                :style="{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                }"
            >
                <div
                    :style="{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#c4b5fd',
                        letterSpacing: '0.05em',
                    }"
                >
                    SOCKUDO
                </div>
            </div>
            <div
                :style="{
                    fontSize: '18px',
                    color: '#64648a',
                }"
            >
                sockudo.io
            </div>
        </div>
    </div>
</template>
