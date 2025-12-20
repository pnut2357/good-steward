import Button from "@/components/Button";
import CircleButton from "@/components/CircleButton";
import EmojiList from "@/components/EmojiList";
import EmojiPicker from "@/components/EmojiPicker";
import EmojiSticker from "@/components/EmojiSticker";
import IconButton from "@/components/IconButton";
import ImageViewer from "@/components/ImageViewer";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import domtoimage from "dom-to-image";
import { type ImageSource } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { captureRef } from "react-native-view-shot";


const placeHolderImage = require("../../assets/images/good-steward-logo.png");

export default function Index() {
  const imageRef = useRef<View>(null);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [showAppOptions, setShowAppOptions] = useState(false);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const [pickedEmoji, setPickedEmoji] = useState<ImageSource | string | undefined>(undefined);
  useEffect(() => {
    if (permissionResponse?.status === 'granted') {
      requestPermission();
    }
  }, []);

  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setShowAppOptions(true);
      console.log(result.assets[0].uri);
    } else {
      alert("You did not select any image.");
    }
  };
  const onReset = () => {
    // setSelectedImage(undefined);

    setShowAppOptions(false);
  };
  const onEmojiPickerClose = () => {
    setIsEmojiPickerVisible(false);
  };
  const onAddSticker = () => {
    console.log("Add sticker");
    setIsEmojiPickerVisible(true);
  };
  const onSaveImageAsync = async () => {
    if (Platform.OS === "web") {
      try {
        const dataUrl = await domtoimage.toJpeg(imageRef.current, { quality: 0.95, width: 320, height: 440 });
        const link = document.createElement("a");
        link.download = "image.jpeg";
        link.href = dataUrl;
        link.click();
        alert("Saved!");
      } catch (e) {
        console.log(e);
      }
    } else {
      try {
        const localUri = await captureRef(imageRef, {
          height: 440,
          quality: 1,
        });
        await MediaLibrary.saveToLibraryAsync(localUri);
        if (localUri) {
          alert("Saved!");
        }
      } catch (e) {
        console.log(e);
      }
    }
  };
  return (
    <View style={styles.container}>
      <View ref={imageRef} style={imageStyles.imageContainer}>
        <ImageViewer ImageSource={selectedImage || placeHolderImage} />
        {pickedEmoji && <EmojiSticker imageSize={40} stickerSource={pickedEmoji} />}
      </View>
      {showAppOptions ? (
        <View style={styles.optionsContainer}>
          <View style={styles.optionsRow}>
            <IconButton icon="refresh" label="Reset" onPress={onReset} />
            <CircleButton icon="add" onPress={onAddSticker} />
            <IconButton icon="save-alt" label="Save" onPress={onSaveImageAsync} />
          </View>
        </View>
      ) : (
        <View style={styles.footerContainer}>
          <Button onPress={pickImageAsync} label="Choose a photo" theme="primary" />
          <Button label="Use this photo" onPress={() => setShowAppOptions(true)} />
        </View>
      )}
      <EmojiPicker isVisible={isEmojiPickerVisible} onClose={onEmojiPickerClose}>
        <EmojiList onSelect={(item) => setPickedEmoji(item)} onCloseModal={onEmojiPickerClose} />
        <View style={styles.emojiContainer}>
          <Pressable onPress={onEmojiPickerClose}>
            <MaterialIcons name="close" size={22} color="#fff" />
          </Pressable>
        </View>
      </EmojiPicker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#B6FFBB",
  },
  footerContainer: {
    alignItems: "center",
    padding: 20,
  },
  optionsContainer: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 20,
  },
  emojiContainer: {
    alignItems: "flex-end",
    padding: 10,
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