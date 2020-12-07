import { createModel } from '@rematch/core';
import { message } from 'antd';
import intl from 'react-intl-universal';

import service from '#assets/config/service';
import { configToJson, getGQLByConfig } from '#assets/utils/import';

interface ITag {
  props: any[];
  name: string;
}

interface IVertexConfig {
  name: string;
  file: any;
  tags: ITag[];
  idMapping: any;
  useHash: string;
}

interface IEdgeConfig {
  name: string;
  file: any;
  props: any[];
  type: string;
}

interface IState {
  currentStep: number;
  activeStep: number;
  mountPath: string;
  files: any[];
  vertexesConfig: IVertexConfig[];
  edgesConfig: IEdgeConfig[];
  activeVertexIndex: number;
  activeEdgeIndex: number;
  vertexAddCount: number;
  edgeAddCount: number;
  isImporting: boolean;
  taskId: string;
}

export const importData = createModel({
  state: {
    activeStep: 0,
    currentStep: 0,
    // the mountPath config by the env variable of WORKING_DIR, upload file must be in that dir.
    mountPath: '',
    files: [] as any[],
    vertexesConfig: [] as IVertexConfig[],
    edgesConfig: [] as IEdgeConfig[],
    activeVertexIndex: -1,
    activeEdgeIndex: -1,
    isImporting: false,
    taskId: 'all',
    vertexAddCount: 1,
    edgeAddCount: 1,
  },
  reducers: {
    update: (state: IState, payload: any) => {
      return {
        ...state,
        ...payload,
      };
    },
    newVertexConfig: (state: IState, payload: any) => {
      const { file } = payload;
      const { vertexesConfig, vertexAddCount } = state;
      const vertexName = `${intl.get('import.datasource')} ${vertexAddCount}`;
      return {
        ...state,
        vertexesConfig: [
          ...vertexesConfig,
          {
            name: vertexName,
            file,
            tags: [],
            idMapping: null,
            useHash: 'unset',
          },
        ],
        activeVertexIndex: vertexesConfig.length,
        vertexAddCount: vertexAddCount + 1,
      };
    },
    updateVertexConfig: (state: IState, vertex: IVertexConfig) => {
      const { activeVertexIndex, vertexesConfig } = state;
      vertexesConfig[activeVertexIndex] = vertex;

      return {
        ...state,
        vertexesConfig,
      };
    },
    deleteVertexConfig: (state: IState, payload: any) => {
      const { vertexName } = payload;
      const { vertexesConfig, activeVertexIndex } = state;
      let deleteIndex;
      const newVertexesConfig = vertexesConfig.filter((v, i) => {
        if (v.name !== vertexName) {
          return true;
        } else {
          deleteIndex = i;
          return false;
        }
      });
      let newActiveVertexIndex;
      if (activeVertexIndex === deleteIndex) {
        newActiveVertexIndex = newVertexesConfig.length === 0 ? -1 : 0;
      } else {
        newActiveVertexIndex =
          activeVertexIndex > deleteIndex
            ? activeVertexIndex - 1
            : activeVertexIndex;
      }

      return {
        ...state,
        activeVertexIndex: newActiveVertexIndex,
        vertexesConfig: newVertexesConfig,
      };
    },
    updateTagConfig: (
      state: IState,
      payload: {
        tagIndex: number;
        props: any;
        tag: string;
      },
    ) => {
      const { vertexesConfig, activeVertexIndex } = state;
      const vertex = vertexesConfig[activeVertexIndex];
      const { props, tagIndex, tag } = payload;
      const tagConfig = vertex.tags[tagIndex];
      tagConfig.name = tag;
      tagConfig.props = props;

      return {
        ...state,
        vertexesConfig,
      };
    },
    deleteTag: (state: IState, tagIndex: number) => {
      const { vertexesConfig, activeVertexIndex } = state;
      const vertex = vertexesConfig[activeVertexIndex];
      vertex.tags.splice(tagIndex, 1);

      return {
        ...state,
        vertexesConfig: [...vertexesConfig],
      };
    },
    addTag: (state: IState) => {
      const { vertexesConfig, activeVertexIndex } = state;
      const vertex = vertexesConfig[activeVertexIndex];
      vertex.tags.push({
        name: '',
        props: [],
      });

      return {
        ...state,
        vertexesConfig: [...vertexesConfig],
      };
    },
    newEdgeConfig: (state: IState, payload: any) => {
      const { file } = payload;
      const { edgesConfig, edgeAddCount } = state;
      const edgeName = `Edge ${edgeAddCount}`;

      return {
        ...state,
        edgesConfig: [
          ...edgesConfig,
          {
            file,
            name: edgeName,
            props: [],
            type: '',
          },
        ],
        activeEdgeIndex: edgesConfig.length,
        edgeAddCount: edgeAddCount + 1,
      };
    },
    deleteEdgeConfig: (state: IState, payload: any) => {
      const { edgesConfig, activeEdgeIndex } = state;
      const { edgeName } = payload;
      let deleteIndex;
      const newEdgesConfig = edgesConfig.filter((e, i) => {
        if (e.name !== edgeName) {
          return true;
        } else {
          deleteIndex = i;
          return false;
        }
      });

      let newActiveEdgeIndex;
      if (activeEdgeIndex === deleteIndex) {
        newActiveEdgeIndex = newEdgesConfig.length === 0 ? -1 : 0;
      } else {
        newActiveEdgeIndex =
          activeEdgeIndex > deleteIndex ? activeEdgeIndex - 1 : activeEdgeIndex;
      }

      return {
        ...state,
        edgesConfig: newEdgesConfig,
        activeEdgeIndex: newActiveEdgeIndex,
      };
    },

    updateEdgeConfig: (state: IState, payload: any) => {
      const { edgesConfig, activeEdgeIndex } = state;
      const { props, edgeType } = payload;
      const edge = edgesConfig[activeEdgeIndex];
      edge.props = props;
      edge.type = edgeType;

      return {
        ...state,
        edgesConfig,
      };
    },

    // just make new copy config to render
    refresh: (state: IState) => {
      return {
        ...state,
      };
    },
    nextStep: (state: IState) => {
      const { activeStep, currentStep } = state;
      switch (activeStep) {
        case 0:
          return {
            ...state,
            activeStep: 1,
            currentStep: currentStep > 1 ? currentStep : 1,
          };
        case 1:
          return {
            ...state,
            currentStep: currentStep > 2 ? currentStep : 2,
            activeStep: 2,
          };
        case 2:
          return {
            ...state,
            currentStep: currentStep > 3 ? currentStep : 3,
            activeStep: 3,
          };
        case 3:
          return {
            ...state,
            currentStep: currentStep > 4 ? currentStep : 4,
            activeStep: 4,
          };
        case 4:
          return {
            ...state,
            activeStep: 0,
          };
        default:
          return state;
      }
    },
  },
  effects: {
    async resetAllConfig() {
      this.update({
        activeStep: 0,
        currentStep: 0,
        files: [] as any[],
        vertexesConfig: [] as IVertexConfig[],
        edgesConfig: [] as IEdgeConfig[],
        activeVertexIndex: -1,
        activeEdgeIndex: -1,
        vertexAddCount: 0,
        edgeAddCount: 0,
        isImporting: false,
      });
    },
    async importData(payload) {
      const config: any = configToJson(payload);
      const { taskId, errCode, errMsg } = (await service.importData(
        config,
      )) as any;
      if (errCode === 0) {
        service.runImport({ taskId });
        this.update({
          taskId,
          isImporting: true,
        });
      } else {
        message.error(errMsg);
      }
      return errCode;
    },

    async stopImport(payload) {
      this.update({
        isImporting: false,
      });
      service.stopImport(payload);
    },

    async changeTagType(payload: {
      activeVertexIndex: number;
      vertexesConfig: IVertexConfig[];
      record: any;
      tagName: string;
      type: string;
    }) {
      const {
        activeVertexIndex,
        vertexesConfig,
        record,
        tagName,
        type,
      } = payload;
      vertexesConfig[activeVertexIndex].tags.forEach(tag => {
        if (tag.name === tagName) {
          tag.props.forEach(prop => {
            if (prop.name === record.name) {
              prop.type = type;
            }
          });
        }
      });
      this.update({
        vertexesConfig,
      });
    },

    async changeEdgeFieldType(payload: {
      edge: IEdgeConfig;
      propName: string;
      type: string;
    }) {
      const { edge, propName, type } = payload;
      edge.props.forEach(prop => {
        if (prop.name === propName) {
          prop.type = type;
        }
      });
      this.update({
        edge,
      });
    },

    async testImport(payload) {
      const config: any = configToJson(payload);
      const { taskId, errCode } = (await service.importData(config)) as any;
      this.update({
        taskId,
      });
      return errCode;
    },

    async asyncTestDataMapping(payload: {
      vertexesConfig: any[];
      edgesConfig: any[];
      activeStep: number;
    }) {
      const { vertexesConfig, edgesConfig, activeStep } = payload;
      const configInfo = {
        vertexesConfig: activeStep === 2 ? vertexesConfig : [],
        edgesConfig: activeStep === 3 ? edgesConfig : [],
      };
      try {
        const gql: string = getGQLByConfig(configInfo).join(';');
        const { code, message: msg } = (await service.execNGQL({
          gql,
        })) as any;
        if (code !== 0) {
          message.error(`${msg}`);
        }
        return code;
      } catch (error) {
        console.log(error);
      }
    },

    async asyncUpdateEdgeConfig(payload: { edgeType: string }) {
      const { edgeType } = payload;
      const { code, data } = (await service.execNGQL({
        gql: 'DESCRIBE EDGE' + '`' + edgeType + '`;',
      })) as any;
      if (code === 0) {
        const props = data.tables.map(item => ({
          name: item.Field,
          type: item.Type,
          mapping: null,
        }));

        this.updateEdgeConfig({
          props: [
            // each edge must have the three special prop srcId, dstId, rank，put them ahead
            {
              name: 'srcId',
              type: 'int',
              mapping: null,
              useHash: 'unset',
            },
            {
              name: 'dstId',
              type: 'int',
              mapping: null,
              useHash: 'unset',
            },
            {
              name: 'rank',
              type: 'int',
              mapping: null,
            },
            ...props,
          ],
          edgeType,
        });
      }
    },

    async asyncUpdateTagConfig(payload: { tag: string; tagIndex: number }) {
      const { tag, tagIndex } = payload;
      const { code, data } = (await service.execNGQL({
        // HACK: Processing keyword
        gql: 'DESCRIBE TAG' + '`' + tag + '`;',
      })) as any;
      if (code === 0) {
        const props = data.tables.map(attr => ({
          name: attr.Field,
          type: attr.Type,
          mapping: null,
          useHash: 'unset',
        }));
        this.updateTagConfig({
          props,
          tagIndex,
          tag,
        });
      }
    },

    async asyncGetImportWorkingDir() {
      const { code, data } = (await service.getImportWokingDir()) as any;
      const { dir } = data;
      if (code === 0 && dir) {
        this.update({
          mountPath: dir.endsWith('/') ? dir.substring(0, dir.length - 1) : dir,
        });
      } else {
        message.warning(intl.get('import.mountPathWarning'), 5);
      }
    },
  },
});
