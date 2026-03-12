import streamlit as st

st.set_page_config(page_title="{{ project_name | default('chatbot') }}", layout="wide")
st.title("{{ project_name | default('chatbot') }}")
st.caption("Environment: {{ environment | default('dev') }}")

prompt = st.text_input("Ask something")
if prompt:
    st.success(f"You asked: {prompt}")
