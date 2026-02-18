<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: 'Sockudo Documentation',
  },
  description: {
    type: String,
    default: 'Production-Ready Realtime Infrastructure',
  },
})
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
      background: 'linear-gradient(145deg, #0f0f1a 0%, #1a1025 40%, #0d0d1a 100%)',
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
        background: 'linear-gradient(90deg, transparent 0%, #7938d3 30%, #9b5de5 50%, #7938d3 70%, transparent 100%)',
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
        background: 'radial-gradient(circle, rgba(121, 56, 211, 0.15) 0%, transparent 70%)',
      }"
    />

    <!-- Ninja icon -->
    <img
      src="/sockudo-logo/sockudo-icon-color.svg"
      width="160"
      height="160"
      :style="{
        marginBottom: '32px',
      }"
    />

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
        background: 'linear-gradient(180deg, transparent 0%, rgba(121, 56, 211, 0.05) 100%)',
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
