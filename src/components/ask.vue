<script setup></script>

<template>
  <div>
    <div
      id="alert-additional-content-2"
      class="p-4 mb-4 text-sm text-fg-danger-strong rounded-base bg-danger-soft border border-danger-subtle"
      role="alert">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <AppIcon name="help" class="w-4 h-4 shrink-0 me-2" />
          <span class="sr-only">Info</span>
          <h3 class="font-medium">{{ title }}</h3>
        </div>
        <button
          type="button"
          data-dismiss-target="#alert-additional-content-2"
          aria-label="Close"
          class="ms-auto -mx-1.5 -my-1.5 bg-danger-soft text-fg-danger-strong rounded focus:ring-2 focus:ring-danger-medium p-1.5 hover:bg-danger-medium inline-flex items-center justify-center h-8 w-8 shrink-0">
          <span class="sr-only">Close</span>
          <AppIcon name="x" class="w-4 h-4" />
        </button>
      </div>
      <div class="mt-2 mb-4">
        {{ message }}
      </div>
      <button
        type="button"
        class="inline-flex items-center text-white bg-danger box-border border border-transparent hover:bg-danger-strong focus:ring-4 focus:ring-danger-medium shadow-xs font-medium leading-5 rounded-base text-xs px-3 py-1.5 focus:outline-none">
        <AppIcon name="eye" class="w-3.5 h-3.5 me-1.5" />
        Delete
      </button>
    </div>
  </div>
</template>

<style scoped></style>
