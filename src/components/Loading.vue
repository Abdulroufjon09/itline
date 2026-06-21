<template>
  <div
    v-if="ui.loading"
<<<<<<< HEAD
    class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      class="animate-spin text-white"
    >
      <defs>
        <linearGradient
          id="SVGw6R8JeYL"
          x1="50%"
          x2="50%"
          y1="5.271%"
          y2="91.793%"
        >
          <stop offset="0%" stop-color="currentColor" />
          <stop offset="100%" stop-color="currentColor" stop-opacity=".55" />
        </linearGradient>

        <linearGradient
          id="SVGuYHJbeXC"
          x1="50%"
          x2="50%"
          y1="15.24%"
          y2="87.15%"
        >
          <stop offset="0%" stop-color="currentColor" stop-opacity="0" />
          <stop offset="100%" stop-color="currentColor" stop-opacity=".55" />
        </linearGradient>
      </defs>

      <g fill="none">
        <path
          d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"
        />

        <path
          fill="url(#SVGw6R8JeYL)"
          d="M8.749.021a1.5 1.5 0 0 1 .497 2.958A7.5 7.5 0 0 0 3 10.375a7.5 7.5 0 0 0 7.5 7.5v3c-5.799 0-10.5-4.7-10.5-10.5C0 5.23 3.726.865 8.749.021"
          transform="translate(1.5 1.625)"
        />

        <path
          fill="url(#SVGuYHJbeXC)"
          d="M15.392 2.673a1.5 1.5 0 0 1 2.119-.115A10.48 10.48 0 0 1 21 10.375c0 5.8-4.701 10.5-10.5 10.5v-3a7.5 7.5 0 0 0 5.007-13.084a1.5 1.5 0 0 1-.115-2.118"
          transform="translate(1.5 1.625)"
        />
      </g>
=======
    class="absolute inset-0 flex items-center justify-center text-blue-500 w-24 z-50">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24">
      <path d="M0 0h24v24H0z" fill="none" />
      <circle cx="12" cy="2" r="0" fill="currentColor">
        <animate
          attributeName="r"
          begin="0"
          calcMode="spline"
          dur="1s"
          keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
          repeatCount="indefinite"
          values="0;2;0;0" />
      </circle>
      <circle
        cx="12"
        cy="2"
        r="0"
        fill="currentColor"
        transform="rotate(45 12 12)">
        <animate
          attributeName="r"
          begin="0.125s"
          calcMode="spline"
          dur="1s"
          keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
          repeatCount="indefinite"
          values="0;2;0;0" />
      </circle>
      <circle
        cx="12"
        cy="2"
        r="0"
        fill="currentColor"
        transform="rotate(90 12 12)">
        <animate
          attributeName="r"
          begin="0.25s"
          calcMode="spline"
          dur="1s"
          keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
          repeatCount="indefinite"
          values="0;2;0;0" />
      </circle>
      <circle
        cx="12"
        cy="2"
        r="0"
        fill="currentColor"
        transform="rotate(135 12 12)">
        <animate
          attributeName="r"
          begin="0.375s"
          calcMode="spline"
          dur="1s"
          keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
          repeatCount="indefinite"
          values="0;2;0;0" />
      </circle>
      <circle
        cx="12"
        cy="2"
        r="0"
        fill="currentColor"
        transform="rotate(180 12 12)">
        <animate
          attributeName="r"
          begin="0.5s"
          calcMode="spline"
          dur="1s"
          keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
          repeatCount="indefinite"
          values="0;2;0;0" />
      </circle>
      <circle
        cx="12"
        cy="2"
        r="0"
        fill="currentColor"
        transform="rotate(225 12 12)">
        <animate
          attributeName="r"
          begin="0.625s"
          calcMode="spline"
          dur="1s"
          keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
          repeatCount="indefinite"
          values="0;2;0;0" />
      </circle>
      <circle
        cx="12"
        cy="2"
        r="0"
        fill="currentColor"
        transform="rotate(270 12 12)">
        <animate
          attributeName="r"
          begin="0.75s"
          calcMode="spline"
          dur="1s"
          keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
          repeatCount="indefinite"
          values="0;2;0;0" />
      </circle>
      <circle
        cx="12"
        cy="2"
        r="0"
        fill="currentColor"
        transform="rotate(315 12 12)">
        <animate
          attributeName="r"
          begin="0.875s"
          calcMode="spline"
          dur="1s"
          keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
          repeatCount="indefinite"
          values="0;2;0;0" />
      </circle>
>>>>>>> 2f325a63d78006016bc31b3b9ec93f6bda91bf20
    </svg>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from "../stores/uiStore";
<<<<<<< HEAD

const ui = useUiStore();
</script>

<style scoped>
</style>
=======
const ui = useUiStore();
</script>

<style scoped></style>
>>>>>>> 2f325a63d78006016bc31b3b9ec93f6bda91bf20
