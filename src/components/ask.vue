<script setup></script>

<template>
  <div>
    <div
      id="alert-additional-content-2"
      class="p-4 mb-4 text-sm text-fg-danger-strong rounded-base bg-danger-soft border border-danger-subtle"
      role="alert">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <svg
            class="w-4 h-4 shrink-0 me-2"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 11h2v5m-2 0h4m-2.592-8.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span class="sr-only">Info</span>
          <h3 class="font-medium">This is a danger alert</h3>
        </div>
        <button
          type="button"
          data-dismiss-target="#alert-additional-content-2"
          aria-label="Close"
          class="ms-auto -mx-1.5 -my-1.5 bg-danger-soft text-fg-danger-strong rounded focus:ring-2 focus:ring-danger-medium p-1.5 hover:bg-danger-medium inline-flex items-center justify-center h-8 w-8 shrink-0">
          <span class="sr-only">Close</span>
          <svg
            class="w-4 h-4"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18 17.94 6M18 18 6.06 6" />
          </svg>
        </button>
      </div>
      <div class="mt-2 mb-4">
        More info about this info alert goes here. This example text is going to
        run a bit longer so that you can see how spacing within an alert works
        with this kind of content.
      </div>
      <button
        type="button"
        class="inline-flex items-center text-white bg-danger box-border border border-transparent hover:bg-danger-strong focus:ring-4 focus:ring-danger-medium shadow-xs font-medium leading-5 rounded-base text-xs px-3 py-1.5 focus:outline-none">
        <svg
          class="w-3.5 h-3.5 me-1.5"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          viewBox="0 0 24 24">
          <path
            stroke="currentColor"
            stroke-width="2"
            d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z" />
          <path
            stroke="currentColor"
            stroke-width="2"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
        Delete
      </button>
    </div>
  </div>
</template>

<style scoped></style>
