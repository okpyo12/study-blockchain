import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { Banner, TopHeader } from "../components";
import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  return (
    <div>
      <TopHeader />
      <Banner />
    </div>
  );
};

export default Home;
