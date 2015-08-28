import os
from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
# README = open(os.path.join(here, 'README.rst')).read()
# CHANGES = open(os.path.join(here, 'CHANGES.rst')).read()

requires = [
    'Flask',
    'flask-cors',
    'requests'
]

setup(name='Audio-tagger',
      version='0.1',
      description='Audio tagging application',
      license='BSD',
      classifiers=[
          "Development Status :: 1 - pre-alpha",
          "Intended Audience :: Developers",
          "Environment :: Web Environment",
          "License :: OSI Approved :: BSD License",
          "Operating System :: OS Independent",
          "Programming Language :: JavaScript",
          "Programming Language :: Python",
          "Programming Language :: Python :: 2.7",
          "Topic :: Internet",
          "Topic :: Internet :: WWW/HTTP",
      ],
      author='Bhanu Prakash',
      author_email='bhanu@servelots.com',
      url='https://github.com.janastu/audio-tagger',
      keywords='',
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      install_requires=requires)
