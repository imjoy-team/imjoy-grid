import { expect } from "chai";
import { shallowMount } from "@vue/test-utils";
import GridWindow from "@/components/GridWindow.vue";
import { store } from "../../src/store";

describe("GridWindow.vue", () => {
  it("renders props.msg when passed", () => {
    const wrapper = shallowMount(GridWindow, {
      propsData: { $store: store }
    });
    expect(wrapper.text()).to.include("Layers");
  });
});
