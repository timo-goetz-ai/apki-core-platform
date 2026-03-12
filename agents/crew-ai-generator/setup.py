from setuptools import find_packages, setup

setup(
    name="crew-ai-generator",
    version="0.1.0",
    description="Template generator for Crew AI projects",
    packages=find_packages(),
    install_requires=["Jinja2>=3.1.0"],
    entry_points={
        "console_scripts": [
            "crew-ai-generator=generator.cli:main",
        ]
    },
)
