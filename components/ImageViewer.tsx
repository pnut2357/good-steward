import { Image } from "expo-image";
import { StyleSheet } from "react-native";

type Props = {
    ImageSource: number | string;
}
export default function ImageViewer({ ImageSource }: Props) {
  return (
    <Image source={ImageSource} style={imageStyles.image}>
    </Image>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#B6FFBB",
  },
});

const textStyles = StyleSheet.create({
  text: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "bold",
  },
});

const imageStyles = StyleSheet.create({
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#B6FFBB",
    // borderRadius: 100,
    overflow: "hidden",
    // borderWidth: 1,
    borderColor: "#B6FFBB",
  },
});