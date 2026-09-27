import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';
import { applyLocaleToDocument } from '$lib/i18n';

applyLocaleToDocument();

mount(App, { target: document.getElementById('app')! });
