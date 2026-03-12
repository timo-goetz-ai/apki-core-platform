import streamlit as st

st.title("Settings")
st.write("Environment: {{ environment | default('dev') }}")
